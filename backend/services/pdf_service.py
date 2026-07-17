import fitz
import re
import logging

logger = logging.getLogger(__name__)

class PdfService:
    @staticmethod
    def extract_biomarkers(pdf_bytes: bytes) -> dict:
        """
        Parses a PDF byte stream using PyMuPDF and extracts key thyroid and clinical biomarkers using robust Regex patterns.
        """
        extracted = {}
        try:
            doc = fitz.open("pdf", pdf_bytes)
            text = ""
            for page in doc:
                text += page.get_text("text") + "\n"
                
            logger.info(f"Extracted {len(text)} characters of text from PDF.")
            
            # TSH - matches "TSH", "TSH (Ultrasensitive)", "Thyroid Stimulating Hormone"
            tsh_match = re.search(r"(?i)\b(?:TSH|Thyroid\s*Stimulating\s*Hormone)\b[^\d\n]{0,40}?(\d+\.\d+|\d+)", text)
            if tsh_match:
                extracted['tsh'] = float(tsh_match.group(1))
                
            # Free T3
            ft3_match = re.search(r"(?i)\b(?:FT-?3|Free\s*T-?3)\b[^\d\n]{0,40}?(\d+\.\d+|\d+)", text)
            if ft3_match:
                extracted['t3'] = float(ft3_match.group(1))
            else:
                # Total T3 fallback
                t3_match = re.search(r"(?i)\b(?:T-?3|Total\s*T-?3|Triiodothyronine)\b[^\d\n]{0,40}?(\d+\.\d+|\d+)", text)
                if t3_match:
                    extracted['t3'] = float(t3_match.group(1))

            # Free T4
            ft4_match = re.search(r"(?i)\b(?:FT-?4|Free\s*T-?4)\b[^\d\n]{0,40}?(\d+\.\d+|\d+)", text)
            if ft4_match:
                extracted['t4'] = float(ft4_match.group(1))
            else:
                # Total T4 fallback
                t4_match = re.search(r"(?i)\b(?:T-?4|Total\s*T-?4|Thyroxine)\b[^\d\n]{0,40}?(\d+\.\d+|\d+)", text)
                if t4_match:
                    extracted['t4'] = float(t4_match.group(1))
                    
            # Haemoglobin
            hb_match = re.search(r"(?i)\b(?:Haemoglobin|Hemoglobin|Hb)\b[^\d\n]{0,40}?(\d+\.\d+|\d+)", text)
            if hb_match:
                extracted['hb'] = float(hb_match.group(1))
                
            # Vitamin D
            vitd_match = re.search(r"(?i)\b(?:Vitamin\s*D|Vit\s*D|25[\s-]?OH\s*Vitamin\s*D)\b[^\d\n]{0,40}?(\d+\.\d+|\d+)", text)
            if vitd_match:
                extracted['vitD'] = float(vitd_match.group(1))

        except Exception as e:
            logger.error(f"Error parsing PDF: {e}")
            raise Exception(f"Failed to read PDF file. Make sure it is not encrypted or corrupted. Details: {str(e)}")
            
        return extracted
