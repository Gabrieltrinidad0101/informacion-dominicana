// Mount each slide into its own direct child of <deck-stage>,
// so the web component treats each one as a real slide.
function DeckSlide({ index, Component }) {
  const active = useActiveSlide() === index;
  return <Component active={active} />;
}

[
  { id: 'slide-1', Component: Slide1, index: 0 },
  { id: 'slide-2', Component: Slide2, index: 1 },
  { id: 'slide-3', Component: Slide3, index: 2 },
  { id: 'slide-4', Component: Slide4, index: 3 },
  { id: 'slide-5', Component: Slide5, index: 4 },
].forEach(({ id, Component, index }) => {
  const el = document.getElementById(id);
  if (el) {
    ReactDOM.createRoot(el).render(<DeckSlide index={index} Component={Component} />);
  }
});
