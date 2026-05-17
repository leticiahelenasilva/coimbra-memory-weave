import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { Stack, type StackHandle } from "./Stack";

const cards = ["primeiro", "segundo", "terceiro"].map((label) => (
  <span data-testid="stack-card-content" key={label}>
    {label}
  </span>
));

const topCardText = () => {
  const renderedCards = screen.getAllByTestId("stack-card-content");
  return renderedCards[renderedCards.length - 1].textContent;
};

function ControlledStack() {
  const stackRef = useRef<StackHandle>(null);

  return (
    <>
      <button type="button" onClick={() => stackRef.current?.next()}>
        seguinte
      </button>
      <button type="button" onClick={() => stackRef.current?.previous()}>
        anterior
      </button>
      <div style={{ width: 240, height: 120 }}>
        <Stack ref={stackRef} cards={cards} sendToBackOnClick />
      </div>
    </>
  );
}

describe("Stack", () => {
  it("cycles cards forward and backward through the imperative controls", () => {
    render(<ControlledStack />);

    expect(topCardText()).toBe("terceiro");

    fireEvent.click(screen.getByRole("button", { name: "seguinte" }));
    expect(topCardText()).toBe("segundo");

    fireEvent.click(screen.getByRole("button", { name: "anterior" }));
    expect(topCardText()).toBe("terceiro");
  });

  it("moves the top card back when click navigation is enabled", () => {
    render(
      <div style={{ width: 240, height: 120 }}>
        <Stack cards={cards} sendToBackOnClick />
      </div>,
    );

    fireEvent.click(screen.getByText("terceiro"));

    expect(topCardText()).toBe("segundo");
  });
});
