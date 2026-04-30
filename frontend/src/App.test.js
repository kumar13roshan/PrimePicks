import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("App", () => {
  let container;
  let root;

  beforeEach(() => {
    window.localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    container = null;
    root = null;
  });

  test("renders the welcome page content", () => {
    act(() => {
      root.render(<App />);
    });

    expect(container.textContent).toMatch(/run your store with calm, confident control\./i);
    expect(container.textContent).toMatch(/get started/i);
  });
});
