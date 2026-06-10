import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, Button, Icon } from "@/components/ui";

describe("ui primitives", () => {
  it("renders a Button with its label", () => {
    render(<Button>Analyze</Button>);
    expect(screen.getByRole("button", { name: "Analyze" })).toBeInTheDocument();
  });

  it("renders a Badge with its content", () => {
    render(<Badge color="amber">14-day streak</Badge>);
    expect(screen.getByText("14-day streak")).toBeInTheDocument();
  });

  it("renders an Icon as an svg for a known name", () => {
    const { container } = render(<Icon name="check" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
