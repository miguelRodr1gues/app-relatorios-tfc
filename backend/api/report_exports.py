import csv
import hashlib
import io
import json
import os
from zoneinfo import ZoneInfo

from django.conf import settings
from django.utils import timezone

from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.platypus import HRFlowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


_PDF_RENDER_CONTEXT = {}


def _set_pdf_render_context(context: dict) -> None:
    _PDF_RENDER_CONTEXT.clear()
    _PDF_RENDER_CONTEXT.update(context)


def _consume_pdf_render_context() -> dict:
    context = dict(_PDF_RENDER_CONTEXT)
    _PDF_RENDER_CONTEXT.clear()
    return context


def _set_download_response_headers(response, filename: str) -> None:
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    response["Access-Control-Expose-Headers"] = "Content-Disposition"


def _build_csv_bytes(result_column_names, result_rows) -> bytes:
    csv_buffer = io.StringIO()
    csv_writer = csv.writer(csv_buffer, delimiter=";")
    csv_writer.writerow(result_column_names)
    for result_row in result_rows:
        csv_writer.writerow([result_row.get(column_name, "") for column_name in result_column_names])
    return csv_buffer.getvalue().encode("utf-8-sig")


def _build_json_bytes(result_rows) -> bytes:
    return json.dumps(
        result_rows,
        ensure_ascii=False,
        indent=2,
        default=str,
    ).encode("utf-8")


def _format_pdf_column_label(header_name) -> str:
    raw_header = str(header_name or "").strip()
    if not raw_header:
        return ""

    column_name = raw_header.split(".")[-1]
    readable_name = column_name.replace("_", " ").replace("-", " ").strip()
    if not readable_name:
        return raw_header

    return readable_name[:1].upper() + readable_name[1:]


def _build_minimal_pdf(title: str, headers, rows) -> bytes:
    try:
        print(f"[DEBUG] _build_minimal_pdf - Title: {title}, Headers: {headers}, Rows: {len(rows)}")
        context = _consume_pdf_render_context()
        buffer = io.BytesIO()
        association_name = "Ares do Pinhal"
        report_user_name = context.get("user_name")
        report_type = context.get("report_type") or str(title)
        report_description = context.get("report_description")
        report_tables = context.get("report_tables")
        report_id = context.get("report_id") or hashlib.sha1(str(title).encode("utf-8")).hexdigest()[:10].upper()
        logo_path = context.get("logo_path")
        if not logo_path:
            logo_path = os.path.normpath(os.path.join(settings.BASE_DIR, "..", "frontend", "src", "assets", "logo.png"))
        logo_exists = os.path.exists(logo_path)

        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            title=str(title),
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=38 * mm,
            bottomMargin=18 * mm,
        )

        generated_at = timezone.localtime(timezone.now(), ZoneInfo("Europe/Lisbon"))
        generated_label = generated_at.strftime("%d/%m/%Y %H:%M")

        styles = getSampleStyleSheet()
        cover_title_style = ParagraphStyle(
            "CoverTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=28,
            textColor=colors.black,
            alignment=TA_LEFT,
            spaceAfter=0,
        )
        section_title_style = ParagraphStyle(
            "SectionTitle",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=colors.black,
            alignment=TA_LEFT,
            spaceAfter=4,
        )
        cover_body_style = ParagraphStyle(
            "CoverBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=14,
            textColor=colors.HexColor("#444444"),
            alignment=TA_JUSTIFY,
        )
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=colors.black,
            alignment=TA_LEFT,
            spaceAfter=8,
        )
        body_intro_style = ParagraphStyle(
            "BodyIntro",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#4A4A4A"),
            alignment=TA_LEFT,
            spaceAfter=8,
        )
        cell_style = ParagraphStyle(
            "CellStyle",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#333333"),
            alignment=TA_LEFT,
        )

        def _is_center_aligned(header_name: str, value) -> bool:
            normalized_header_name = str(header_name).lower()
            value_as_text = str(value).strip()
            if any(token in normalized_header_name for token in ["id", "data", "date", "codigo", "code"]):
                return True
            return len(value_as_text) <= 12 and value_as_text.replace("-", "").replace("/", "").replace(":", "").isdigit()

        summary_rows = [["Nº", "Nome da tabela", "Descrição breve"]]
        if report_tables:
            for index, table_info in enumerate(report_tables, start=1):
                column_count = int(table_info.get("column_count") or 0)
                columns_label = "coluna" if column_count == 1 else "colunas"
                summary_rows.append(
                    [
                        str(index),
                        str(table_info.get("name") or table_info.get("key") or table_info.get("table") or ""),
                        f"Foram usadas {column_count} {columns_label} nesta tabela.",
                    ]
                )
        else:
            column_count = len(headers or [])
            columns_label = "coluna" if column_count == 1 else "colunas"
            summary_rows.append(["1", "Tabela principal", f"Foram usadas {column_count} {columns_label} nesta tabela."])

        summary_table = Table(
            summary_rows,
            colWidths=[14 * mm, 56 * mm, document.width - (14 * mm + 56 * mm)],
            hAlign="LEFT",
        )
        summary_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E3E3E3")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#C2C2C2")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("ALIGN", (0, 0), (0, -1), "CENTER"),
                ]
            )
        )

        table_data = [[Paragraph(_format_pdf_column_label(header), cell_style) for header in headers]]
        for row in rows:
            table_data.append([Paragraph(str(row.get(header, "")), cell_style) for header in headers])

        column_width = document.width / max(len(headers), 1)
        report_table = Table(
            table_data,
            repeatRows=1,
            colWidths=[column_width] * max(len(headers), 1),
            hAlign="LEFT",
        )
        report_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#D9D9D9")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("LEADING", (0, 0), (-1, -1), 10),
                    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#B5B5B5")),
                    ("LINEBELOW", (0, 0), (-1, 0), 0.6, colors.HexColor("#666666")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F7F7")]),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ]
            )
        )
        for row_index, row in enumerate(rows, start=1):
            for col_index, header in enumerate(headers):
                if _is_center_aligned(header, row.get(header, "")):
                    report_table.setStyle(TableStyle([("ALIGN", (col_index, row_index), (col_index, row_index), "CENTER")]))

        story = [
            Spacer(1, 62 * mm),
            Paragraph(str(title).upper(), cover_title_style),
            Spacer(1, 14 * mm),
            Paragraph("DESCRIÇÃO DO RELATÓRIO", section_title_style),
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#7F7F7F")),
            Spacer(1, 6 * mm),
            Paragraph(report_description, cover_body_style),
            Spacer(1, 16 * mm),
            Paragraph("RESUMO DAS TABELAS INCLUÍDAS", section_title_style),
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#7F7F7F")),
            Spacer(1, 6 * mm),
            summary_table,
            PageBreak(),
            Paragraph(str(title), title_style),
            Paragraph(
                f"Tabela principal de dados exportados. Tipo de relatório: {report_type}.",
                body_intro_style,
            ),
            report_table,
        ]

        def _draw_cover_header(canvas_obj, doc):
            canvas_obj.saveState()
            page_width, page_height = A4
            top_y = page_height - 18 * mm
            logo_width = 14 * mm
            logo_height = 14 * mm

            if logo_exists:
                logo_x = page_width - doc.rightMargin - logo_width
                canvas_obj.drawImage(
                    ImageReader(logo_path),
                    logo_x,
                    top_y - logo_height,
                    width=logo_width,
                    height=logo_height,
                    preserveAspectRatio=True,
                    mask="auto",
                )
                name_right_x = logo_x - 3 * mm
            else:
                name_right_x = page_width - doc.rightMargin

            canvas_obj.setFillColor(colors.black)
            canvas_obj.setFont("Helvetica-Bold", 10)
            canvas_obj.drawRightString(name_right_x, top_y - 6 * mm, str(association_name))
            canvas_obj.restoreState()

        def _draw_footer(canvas_obj, doc, total_pages):
            page_width, _ = A4
            footer_y = 12 * mm
            canvas_obj.setStrokeColor(colors.HexColor("#A0A0A0"))
            canvas_obj.setLineWidth(0.4)
            canvas_obj.line(doc.leftMargin, footer_y + 4 * mm, page_width - doc.rightMargin, footer_y + 4 * mm)
            canvas_obj.setFont("Helvetica", 8)
            canvas_obj.setFillColor(colors.HexColor("#555555"))
            canvas_obj.drawString(doc.leftMargin, footer_y, f"ID do relatório: {report_id}")
            canvas_obj.drawRightString(page_width - doc.rightMargin, footer_y, f"Página {canvas_obj.getPageNumber()} de {total_pages}")

        def _draw_content_header(canvas_obj, doc, total_pages):
            canvas_obj.saveState()
            page_width, page_height = A4
            header_top = page_height - 12 * mm
            logo_width = 11 * mm
            logo_height = 11 * mm

            canvas_obj.setFillColor(colors.HexColor("#333333"))
            canvas_obj.setFont("Helvetica", 8)
            left_x = doc.leftMargin
            canvas_obj.drawString(left_x, header_top, f"Relatório: {title}")
            canvas_obj.drawString(left_x, header_top - 4.5 * mm, f"Emitido por: {report_user_name}")
            canvas_obj.drawString(left_x, header_top - 9 * mm, f"Data de emissão: {generated_label}")

            if logo_exists:
                logo_x = page_width - doc.rightMargin - logo_width
                canvas_obj.drawImage(
                    ImageReader(logo_path),
                    logo_x,
                    header_top - logo_height + 1 * mm,
                    width=logo_width,
                    height=logo_height,
                    preserveAspectRatio=True,
                    mask="auto",
                )
                name_right_x = logo_x - 3 * mm
            else:
                name_right_x = page_width - doc.rightMargin

            canvas_obj.setFillColor(colors.black)
            canvas_obj.setFont("Helvetica-Bold", 9)
            canvas_obj.drawRightString(name_right_x, header_top - 3.5 * mm, str(association_name))
            separator_y = page_height - 24 * mm
            canvas_obj.setStrokeColor(colors.HexColor("#8C8C8C"))
            canvas_obj.setLineWidth(0.5)
            canvas_obj.line(doc.leftMargin, separator_y, page_width - doc.rightMargin, separator_y)
            _draw_footer(canvas_obj, doc, total_pages)
            canvas_obj.restoreState()

        class NumberedCanvas(pdf_canvas.Canvas):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self._saved_page_states = []

            def showPage(self):
                self._saved_page_states.append(dict(self.__dict__))
                self._startPage()

            def save(self):
                page_states = self._saved_page_states or [dict(self.__dict__)]
                total_pages = len(page_states)
                for state in page_states:
                    self.__dict__.update(state)
                    if self._pageNumber == 1:
                        _draw_cover_header(self, document)
                        _draw_footer(self, document, total_pages)
                    else:
                        _draw_content_header(self, document, total_pages)
                    super().showPage()
                super().save()

        document.build(story, canvasmaker=NumberedCanvas)
        pdf_bytes = buffer.getvalue()
        print(f"[DEBUG] _build_minimal_pdf - PDF generated, size: {len(pdf_bytes)} bytes")
        return pdf_bytes
    except Exception as error:
        print(f"[DEBUG] _build_minimal_pdf - ERROR: {str(error)}")
        raise
