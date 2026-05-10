from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
from io import BytesIO
from pathlib import Path
from typing import Callable

import fitz
from PIL import Image
from pypdf import PdfReader


TESSERACT_EXE = Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe")
TESSDATA_PREFIX = Path.home() / "tessdata"
OPTION_MARKER_PATTERN = re.compile(r"(?:①|②|③|④|[0-9@QOD©][\)\]}]?)(?=\s+[가-힣A-Za-z])")


def pdf_page_count(path: Path) -> int:
    return len(PdfReader(str(path)).pages)


def normalize_text(value: str) -> str:
    value = value.replace("\u00a0", " ")
    value = value.replace("\r", "\n")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{2,}", "\n", value)
    return value.strip()


def sql_string(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def sql_json_array(values: list[str]) -> str:
    return sql_string(json.dumps(values, ensure_ascii=False)) + "::jsonb"


def ensure_tesseract() -> None:
    if not TESSERACT_EXE.exists():
        raise FileNotFoundError(f"Missing tesseract executable: {TESSERACT_EXE}")
    if not TESSDATA_PREFIX.exists():
        raise FileNotFoundError(f"Missing tessdata directory: {TESSDATA_PREFIX}")


def render_page_image(pdf_path: Path, page_number: int, scale: float = 1.0) -> Image.Image:
    doc = fitz.open(pdf_path)
    try:
        page = doc.load_page(page_number - 1)
        pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        return Image.open(BytesIO(pix.tobytes("png"))).convert("RGB")
    finally:
        doc.close()


def save_rendered_page(pdf_path: Path, page_number: int, output_path: Path, scale: float = 1.0) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    try:
        page = doc.load_page(page_number - 1)
        pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        pix.save(output_path)
    finally:
        doc.close()


def crop_rendered_region(pdf_path: Path, page_number: int, box: tuple[int, int, int, int], output_path: Path, scale: float = 1.0) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image = render_page_image(pdf_path, page_number, scale=scale)
    image.crop(box).save(output_path)


def copy_asset(source: Path, upload_root: Path, relative_target: Path) -> None:
    target = upload_root / relative_target
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def ocr_page_text(pdf_path: Path, page_number: int, cache_dir: Path, scale: float = 2.2, psm: int = 6) -> str:
    ensure_tesseract()
    cache_dir.mkdir(parents=True, exist_ok=True)
    txt_path = cache_dir / f"page_{page_number}.txt"
    if txt_path.exists():
        return txt_path.read_text(encoding="utf-8")

    with tempfile.TemporaryDirectory() as temp_dir_str:
        temp_dir = Path(temp_dir_str)
        image_path = temp_dir / "page.png"
        output_base = temp_dir / "ocr"
        save_rendered_page(pdf_path, page_number, image_path, scale=scale)
        env = os.environ.copy()
        env["TESSDATA_PREFIX"] = str(TESSDATA_PREFIX)
        subprocess.run(
            [str(TESSERACT_EXE), str(image_path), str(output_base), "-l", "kor+eng", "--psm", str(psm)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            env=env,
        )
        text = (temp_dir / "ocr.txt").read_text(encoding="utf-8", errors="ignore")
        txt_path.write_text(text, encoding="utf-8")
        return text


def get_page_texts(
    pdf_path: Path,
    page_numbers: range,
    cache_dir: Path,
    cleaner: Callable[[str], str],
    scale: float = 2.2,
    psm: int = 6,
) -> dict[int, str]:
    return {
        page_number: cleaner(ocr_page_text(pdf_path, page_number, cache_dir, scale=scale, psm=psm))
        for page_number in page_numbers
    }


def extract_shared_prefix(text: str, first_question_start: int) -> str:
    prefix = normalize_text(text[:first_question_start])
    if not prefix:
        return ""
    prefix = re.sub(r"^※\s*\[[^\]]+\].*?(?:각\s*\d+점|\d+\s*점)\)?", "", prefix)
    return normalize_text(prefix)


def build_question_blocks(
    page_texts: dict[int, str],
    valid_numbers: range,
    pattern: re.Pattern[str],
) -> dict[int, str]:
    blocks: dict[int, str] = {}
    for page_number in sorted(page_texts):
        text = page_texts[page_number]
        matches = list(pattern.finditer(text))
        shared_prefix = extract_shared_prefix(text, matches[0].start()) if matches else ""
        for index, match in enumerate(matches):
            q_num = int(match.group(1))
            if q_num not in valid_numbers:
                continue
            end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
            block = normalize_text(text[match.start():end])
            if shared_prefix:
                block = normalize_text(f"{shared_prefix}\n{block}")
            blocks[q_num] = block
    missing = [number for number in valid_numbers if number not in blocks]
    if missing:
        raise ValueError(f"Missing question blocks: {missing}")
    return blocks


def build_page_mapped_blocks(
    page_texts: dict[int, str],
    expected_by_page: dict[int, list[int]],
    pattern: re.Pattern[str],
) -> dict[int, str]:
    blocks: dict[int, str] = {}
    for page_number, expected_numbers in expected_by_page.items():
        text = page_texts[page_number]
        matches = list(pattern.finditer(text))
        if not matches:
            if len(expected_numbers) != 1:
                raise ValueError(f"Missing OCR matches on page {page_number} for questions {expected_numbers}")
            blocks[expected_numbers[0]] = normalize_text(text)
            continue
        shared_prefix = extract_shared_prefix(text, matches[0].start())
        if len(matches) != len(expected_numbers):
            if len(matches) > len(expected_numbers):
                matches = matches[: len(expected_numbers)]
            elif len(matches) + 1 == len(expected_numbers):
                starts = [match.start() for match in matches]
                if starts[0] <= 5:
                    raise ValueError(
                        f"Question count mismatch on page {page_number}: expected {expected_numbers}, found {len(matches)} matches"
                    )
                generic_blocks: list[str] = [text[: starts[0]]]
                generic_blocks.extend(
                    text[starts[index] : starts[index + 1]] if index + 1 < len(starts) else text[starts[index] :]
                    for index in range(len(starts))
                )
                if len(generic_blocks) != len(expected_numbers):
                    raise ValueError(
                        f"Could not recover page {page_number}: expected {expected_numbers}, produced {len(generic_blocks)} blocks"
                    )
                for expected_number, block_text in zip(expected_numbers, generic_blocks, strict=False):
                    block = normalize_text(block_text)
                    if shared_prefix:
                        block = normalize_text(f"{shared_prefix}\n{block}")
                    blocks[expected_number] = block
                continue
            else:
                raise ValueError(
                    f"Question count mismatch on page {page_number}: expected {expected_numbers}, found {len(matches)} matches"
                )
        for index, expected_number in enumerate(expected_numbers):
            start = matches[index].start()
            end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
            block = normalize_text(text[start:end])
            if shared_prefix:
                block = normalize_text(f"{shared_prefix}\n{block}")
            blocks[expected_number] = block
    return blocks


def sanitize_stem_text(value: str) -> str:
    value = normalize_text(value)
    value = re.sub(r"^\d+\.\s*", "", value)
    value = re.sub(r"^\((?:\d+|[0-9A-Za-z]+)\s*점?\)\s*", "", value)
    value = re.sub(r"^\d+\.\s*\((?:\d+|[0-9A-Za-z]+)\s*점?\)\s*", "", value)
    value = re.split(r"\n(?:TOPIK|제\d+회 한국어능력시험)", value, maxsplit=1)[0]
    return normalize_text(value)


def sanitize_option_text(value: str) -> str:
    value = re.split(r"\n(?:TOPIK|제\d+회 한국어능력시험|※\s*\[)", value, maxsplit=1)[0]
    value = value.replace("\n", " ")
    value = re.sub(r"^[0-9@QOD©①②③④][\)\]}]?\s*", "", value)
    return normalize_text(value)


def split_block(block: str) -> tuple[str, list[str]]:
    body = sanitize_stem_text(block)
    matches = list(OPTION_MARKER_PATTERN.finditer(body))
    if len(matches) < 4:
        return body, []
    matches = matches[:4]
    stem = sanitize_stem_text(body[:matches[0].start()])
    options: list[str] = []
    for index, match in enumerate(matches):
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(body)
        options.append(sanitize_option_text(body[start:end]))
    return stem, options
