await page.goto("http://example.com");
await page.getByRole("button", { name: "Submit" }).click();