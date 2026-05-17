import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
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

const stackCardFor = (label: string) => screen.getByText(label).closest(".stack-card");

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
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("autoplays to the next card after the configured delay", () => {
    vi.useFakeTimers();
    render(
      <div style={{ width: 240, height: 120 }}>
        <Stack cards={cards} autoplay autoplayDelay={3000} />
      </div>,
    );

    expect(topCardText()).toBe("terceiro");

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(topCardText()).toBe("segundo");
  });

  it("pauses autoplay while hovered and resumes when the pointer leaves", () => {
    vi.useFakeTimers();
    render(
      <div style={{ width: 240, height: 120 }}>
        <Stack cards={cards} autoplay autoplayDelay={3000} pauseOnHover />
      </div>,
    );

    fireEvent.mouseEnter(screen.getByTestId("stack-container"));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(topCardText()).toBe("terceiro");

    fireEvent.mouseLeave(screen.getByTestId("stack-container"));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(topCardText()).toBe("segundo");
  });

  it("keeps the top card straight and angles the stacked cards underneath", () => {
    render(
      <div style={{ width: 240, height: 120 }}>
        <Stack cards={cards} />
      </div>,
    );

    expect(stackCardFor("terceiro")).toHaveAttribute("data-top-card", "true");
    expect(stackCardFor("terceiro")).toHaveAttribute("data-rotate-z", "0");
    expect(stackCardFor("segundo")).toHaveAttribute("data-top-card", "false");
    expect(stackCardFor("segundo")).not.toHaveAttribute("data-rotate-z", "0");
  });
});
