const basketBtn = document.querySelector(".basket-btn-wrapper");

basketBtn.addEventListener("click", showPanelContainer);

function showPanelContainer() {
  const panelContainer = document.querySelector(".panel__container");
  panelContainer.classList.toggle("panel__container--active");
}

const uploader = document.querySelector(".uploader__input");

uploader.addEventListener("change", (evt) => {
  const uploaderToHide = evt.currentTarget.parentElement.parentElement;
  uploaderToHide.classList.toggle("panel__uploader--hidden");
});


let basketlightningId;

basketBtn.addEventListener("click", () => {
  clearInterval(basketlightningId);
  basketBtn.classList.remove("basket-btn-wrapper--active");
});

document.addEventListener("toBasketFinish", () => {
  basketlightningId = setInterval(() => {
    basketBtn.classList.add("basket-btn-wrapper--active");
  }, 1500);
});
