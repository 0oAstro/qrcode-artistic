import io
import segno
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs
import cgi

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Parse form data
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={'REQUEST_METHOD': 'POST',
                         'CONTENT_TYPE': self.headers['Content-Type']}
            )

            # Extract fields
            url = form.getvalue("url", "")
            scale = int(form.getvalue("scale", 8))
            kind = form.getvalue("kind", "png")
            
            image_field = form['image']
            
            if not url:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"error": "URL parameter is missing"}')
                return

            if not image_field.file:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"error": "Image file is missing"}')
                return

            # Create QR code
            qr = segno.make(url, error='h')
            output_buffer = io.BytesIO()
            
            # Read image data into a buffer
            background_buffer = io.BytesIO(image_field.file.read())

            # Generate artistic QR code
            qr.to_artistic(
                background=background_buffer,
                target=output_buffer,
                scale=scale,
                kind=kind
            )
            output_buffer.seek(0)

            # Determine media type
            media_types = {
                'png': 'image/png',
                'jpg': 'image/jpeg',
                'gif': 'image/gif'
            }
            media_type = media_types.get(kind.lower(), 'image/png')

            # Send response
            self.send_response(200)
            self.send_header('Content-type', media_type)
            self.send_header('Content-Disposition', f'attachment; filename=artistic_qr.{kind}')
            self.end_headers()
            self.wfile.write(output_buffer.read())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(f'{{"error": "Failed to generate QR code: {str(e)}"}}'.encode('utf-8'))

        return
