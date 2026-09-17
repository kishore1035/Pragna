"""Tests for the PDF and PPTX edit/read additions to app.document_generator.

Word (.docx) and Excel (.xlsx) already support real in-place editing via
python-docx/openpyxl, which is exercised via the /api/documents/edit route
tests. These tests cover the previously-missing parity for PDF (structure
sidecar based) and PPTX (direct python-pptx editing) create -> edit -> read
round trips.
"""
from pathlib import Path

import pytest

from app import document_generator as dg


# ─────────────────────────────────────────────────────────────────────────
# PPTX: create -> edit -> read
# ─────────────────────────────────────────────────────────────────────────
def test_create_and_read_presentation(tmp_path):
    filepath = tmp_path / "deck.pptx"
    structure = {
        "title": "Quarterly Review",
        "sections": [
            {"heading": "Highlights", "bullets": ["Revenue up 12%", "Two new hires"], "paragraphs": [], "table": None},
        ],
    }
    dg._build_pptx(structure, str(filepath))
    assert filepath.exists()

    result = dg.read_presentation(str(filepath))
    assert result["success"] is True
    titles = [s["title"] for s in result["slides"]]
    assert "Quarterly Review" in titles
    assert "Highlights" in titles
    highlights_slide = next(s for s in result["slides"] if s["title"] == "Highlights")
    assert "Revenue up 12%" in highlights_slide["bullets"]


def test_edit_presentation_add_slide(tmp_path):
    filepath = tmp_path / "deck.pptx"
    dg._build_pptx({"title": "Deck", "sections": []}, str(filepath))

    result = dg.edit_presentation(
        str(filepath), "add_slide", title="New Slide", bullets=["point one", "point two"]
    )
    assert result["success"] is True

    read_back = dg.read_presentation(str(filepath))
    titles = [s["title"] for s in read_back["slides"]]
    assert "New Slide" in titles
    new_slide = next(s for s in read_back["slides"] if s["title"] == "New Slide")
    assert new_slide["bullets"] == ["point one", "point two"]


def test_edit_presentation_update_slide(tmp_path):
    filepath = tmp_path / "deck.pptx"
    structure = {
        "title": "Deck",
        "sections": [{"heading": "Old Title", "bullets": ["old bullet"], "paragraphs": [], "table": None}],
    }
    dg._build_pptx(structure, str(filepath))

    read_before = dg.read_presentation(str(filepath))
    slide_index = next(i for i, s in enumerate(read_before["slides"]) if s["title"] == "Old Title")

    result = dg.edit_presentation(
        str(filepath), "update_slide", slide_index=slide_index, title="Updated Title", bullets=["new bullet"]
    )
    assert result["success"] is True

    read_after = dg.read_presentation(str(filepath))
    titles = [s["title"] for s in read_after["slides"]]
    assert "Updated Title" in titles
    assert "Old Title" not in titles
    updated_slide = next(s for s in read_after["slides"] if s["title"] == "Updated Title")
    assert updated_slide["bullets"] == ["new bullet"]


def test_edit_presentation_replace_text(tmp_path):
    filepath = tmp_path / "deck.pptx"
    structure = {
        "title": "Cats Overview",
        "sections": [{"heading": "About Cats", "bullets": ["Cats are great"], "paragraphs": [], "table": None}],
    }
    dg._build_pptx(structure, str(filepath))

    result = dg.edit_presentation(str(filepath), "replace_text", search="Cats", replace="Dogs")
    assert result["success"] is True

    read_back = dg.read_presentation(str(filepath))
    all_text = " ".join(s["title"] for s in read_back["slides"]) + " " + " ".join(
        b for s in read_back["slides"] for b in s["bullets"]
    )
    assert "Cats" not in all_text
    assert "Dogs" in all_text


def test_edit_presentation_missing_file_raises(tmp_path):
    with pytest.raises(FileNotFoundError):
        dg.edit_presentation(str(tmp_path / "missing.pptx"), "add_slide", title="x")


def test_edit_presentation_unknown_action_raises(tmp_path):
    filepath = tmp_path / "deck.pptx"
    dg._build_pptx({"title": "Deck", "sections": []}, str(filepath))
    with pytest.raises(ValueError):
        dg.edit_presentation(str(filepath), "not_a_real_action")


# ─────────────────────────────────────────────────────────────────────────
# PDF: create (writes sidecar) -> edit -> read
# ─────────────────────────────────────────────────────────────────────────
def test_create_pdf_writes_structure_sidecar(tmp_path):
    filepath = tmp_path / "report.pdf"
    structure = {
        "title": "Annual Report",
        "sections": [{"heading": "Intro", "bullets": ["point a"], "paragraphs": [], "table": None}],
    }
    dg._build_pdf(structure, str(filepath))

    sidecar = Path(str(filepath) + ".structure.json")
    assert sidecar.exists()


def test_edit_pdf_append_section(tmp_path):
    filepath = tmp_path / "report.pdf"
    structure = {
        "title": "Annual Report",
        "sections": [{"heading": "Intro", "bullets": ["point a"], "paragraphs": [], "table": None}],
    }
    dg._build_pdf(structure, str(filepath))

    result = dg.edit_pdf_document(
        str(filepath), "append_section", heading="Conclusion", paragraphs=["We did well."], bullets=["win 1"]
    )
    assert result["success"] is True
    assert filepath.exists()

    read_back = dg.read_pdf_document(str(filepath))
    assert "Conclusion" in read_back["content"]
    assert "We did well." in read_back["content"]


def test_edit_pdf_replace_text(tmp_path):
    filepath = tmp_path / "report.pdf"
    structure = {
        "title": "Cats Report",
        "sections": [{"heading": "About Cats", "bullets": ["Cats are great"], "paragraphs": [], "table": None}],
    }
    dg._build_pdf(structure, str(filepath))

    result = dg.edit_pdf_document(str(filepath), "replace_text", search="Cats", replace="Dogs")
    assert result["success"] is True

    read_back = dg.read_pdf_document(str(filepath))
    assert "Dogs" in read_back["content"]
    assert "Cats" not in read_back["content"]


def test_edit_pdf_without_sidecar_falls_back_to_extracted_text(tmp_path):
    # Simulate a PDF that wasn't generated by this engine (no sidecar present).
    filepath = tmp_path / "external.pdf"
    dg._build_pdf({"title": "External Doc", "sections": [{"heading": "Body", "bullets": ["existing text"], "paragraphs": [], "table": None}]}, str(filepath))
    sidecar = Path(str(filepath) + ".structure.json")
    sidecar.unlink()  # remove sidecar to force fallback path

    result = dg.edit_pdf_document(str(filepath), "append_section", heading="Appendix", paragraphs=["new info"])
    assert result["success"] is True

    read_back = dg.read_pdf_document(str(filepath))
    assert "Appendix" in read_back["content"]
    assert "new info" in read_back["content"]


def test_edit_pdf_missing_file_raises(tmp_path):
    with pytest.raises(FileNotFoundError):
        dg.edit_pdf_document(str(tmp_path / "missing.pdf"), "append_section", heading="x")


def test_edit_pdf_unknown_action_raises(tmp_path):
    filepath = tmp_path / "report.pdf"
    dg._build_pdf({"title": "Doc", "sections": []}, str(filepath))
    with pytest.raises(ValueError):
        dg.edit_pdf_document(str(filepath), "not_a_real_action")
