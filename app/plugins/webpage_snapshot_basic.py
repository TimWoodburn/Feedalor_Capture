# app/plugins/webpage_snapshot_basic.py

from app.plugins.interface import DecoderInterface
import numpy as np
import cv2
import tempfile
import os
from urllib.parse import urlparse
from playwright.async_api import async_playwright
import asyncio

class WebpageSnapshotBasic(DecoderInterface):
    decoder_name = "webpage_snapshot_basic"

    @staticmethod
    def decode(url: str) -> np.ndarray:
        """
        Capture the viewport-sized snapshot of the given web page URL.
        Returns the image as an OpenCV (numpy ndarray).
        """
        async def capture_page():
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)

                # Set a fixed viewport size
                context = await browser.new_context(
                    viewport={"width": 1920, "height": 1080}
                )

                try:
                    parsed = urlparse(url)
                    domain = parsed.hostname or ""
                    if domain:
                        await context.add_cookies([{
                            "name": "cookie_accepted",
                            "value": "true",
                            "domain": domain,
                            "path": "/"
                        }])
                except Exception as e:
                    print(f"[!] Cookie injection failed (harmless): {e}")

                page = await context.new_page()
                await page.goto(url, timeout=30000)

                try:
                    accept_button = page.locator('text=/.*Accept|Agree.*/i')
                    if await accept_button.is_visible():
                        await accept_button.click()
                        await page.wait_for_timeout(1000)
                except Exception as e:
                    print(f"[!] Auto-accept click failed (harmless): {e}")

                # Capture only viewport (no full_page)
                with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmpfile:
                    tmp_path = tmpfile.name
                await page.screenshot(path=tmp_path, full_page=False)

                await browser.close()

                img = cv2.imread(tmp_path)
                os.unlink(tmp_path)
                return img

        return asyncio.run(capture_page())