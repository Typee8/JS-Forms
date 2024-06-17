const panelForm = document.querySelector(".panel__form");
const excursionsFile = panelForm.querySelector(".uploader__input");
const panelOrder = panelForm.querySelector(".panel__order");

let arrangedFileData;
const basket = [];
let totalPrice;

panelOrder.addEventListener("submit", placeOrder);
excursionsFile.addEventListener("change", readFile);
document.addEventListener("readFileCompleted", tripInterface);

function placeOrder(evt) {
  evt.preventDefault();

  if (basket.length === 0) {
    return alert(`There're no items in the basket.`);
  }

  const panelOrder = panelForm.querySelector(".panel__order");
  const nameEle = panelOrder.querySelector(`input[name = "name"]`);
  const nameValue = nameEle.value;
  const emailEle = panelOrder.querySelector(`input[name = "email"]`);
  const emailValue = emailEle.value;

  const invalidEmail = document.createElement("div");
  invalidEmail.innerText = `You've written invalid email.`;

  if (!nameValidation(nameValue)) {
    showInvalidClientData(nameEle);
    nameEle.addEventListener("click", hideInvalidDataAlert);
  }
  if (!emailValidation(emailValue)) {
    showInvalidClientData(emailEle);
    emailEle.addEventListener("click", hideInvalidDataAlert);
  }

  if (nameValidation(nameValue) && emailValidation(emailValue)) {
    alert(
      `Dziękujemy za złożenie zamówienia o wartości ${totalPrice} PLN. Szczegóły zamówienia zostały wysłane na adres e-mail: ${emailValue}`
    );
    location.reload();
  }
}
function nameValidation(name) {
  if (/^[A-Za-z][A-Za-z\s]*$/.test(name)) {
    return true;
  }
}
function emailValidation(email) {
  if (/^\S+@\S+$/g.test(email)) {
    return true;
  }
}
function showInvalidClientData(input) {
  const orderField = input.parentElement.parentElement;
  const orderFieldError = orderField.querySelector(".order__field-error");
  orderFieldError.innerText = `Invalid data!`;
  input.style.color = "red";
}
function hideInvalidDataAlert(evt) {
  const orderField = evt.target.parentElement.parentElement;
  const orderFieldError = orderField.querySelector(".order__field-error");
  orderFieldError.innerText = "";
  evt.target.style.color = "inherit";
}

function readFile(evt) {
  const file = evt.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (evt) => {
      const result = evt.target.result;
      arrangedFileData = extractData(result);
      readFileCompleted();
    };
  }
}

function extractData(result) {
  const excursionList = result.split(/[\r\n]+/g);
  const excursionData = excursionList.map((excursion) => {
    return excursion
      .replace(/(?<="),(?=")|\r\n/g, "elementsToDelete")
      .split("elementsToDelete")
      .map((item) => {
        return item.replace(/^"|"$/g, "");
      });
  });

  return excursionData;
}

function readFileCompleted() {
  const newEvent = new CustomEvent("readFileCompleted", { bubbles: false });
  document.dispatchEvent(newEvent);
}

function tripInterface() {
  const excursionsContainer = document.querySelector(".excursions");
  const ticketsInputList = excursionsContainer.querySelectorAll(
    'input[name="adults"], input[name="children"]'
  );

  showTrips(arrangedFileData);
  excursionsContainer.addEventListener("submit", manageBasket);
}

function validateOnInputTickets(ticketsInputList) {
  ticketsInputList.forEach((input) => {
    input.addEventListener("keyup", validateNumber);
  });
  ticketsInputList.forEach((input) => {
    input.addEventListener("paste", validateNumber);
  });
}

function showTrips(arrangedFileData) {
  const panelExcursions = document.querySelector(".panel__excursions");
  const excursionsHTML = [];
  arrangedFileData.forEach((excursion) => {
    const excursionTemplate = document
      .querySelector(".excursions__item--prototype")
      .cloneNode(true);
    excursionTemplate.classList.remove("excursions__item--prototype");
    const title = excursionTemplate.querySelector(".excursions__title");
    const description = excursionTemplate.querySelector(
      ".excursions__description"
    );
    const price = excursionTemplate.querySelectorAll(".excursions__price");
    const adultPrice = price[0];
    const childPrice = price[1];

    excursionTemplate.setAttribute("id", excursion[0]);
    title.innerText = excursion[1];
    description.innerText = excursion[2];
    adultPrice.innerText = excursion[3];
    childPrice.innerText = excursion[4];

    excursionsHTML.push(excursionTemplate);
  });
  while (panelExcursions.children[1]) {
    panelExcursions.removeChild(panelExcursions.children[1]);
  }
  excursionsHTML.forEach((item) => {
    panelExcursions.appendChild(item);
  });
}

function validateNumber(evt) {
  if (evt.type === "paste") {
    evt.preventDefault();
    return alert(
      `It's just a number. Do you really need to paste something in here? ☺️`
    );
  }

  const value = evt.target.value;
  if (/^0/.test(value)) {
    evt.target.value = "";
    alert("You can't order 0 number of tickets.");
  } else if (isNaN(value)) {
    evt.target.value = value.match(/^[0-9]*/);
    alert("Input has to be a number!");
  } else if (value > 100) {
    evt.target.value = "";
    alert("We can't sell more than 100 tickets.");
  }
}

function manageBasket(evt) {
  toBasket(evt);
  showBasket();
}

function toBasket(evt) {
  evt.preventDefault();
  const panelExcursions = document.querySelector(".panel__excursions");
  const ticketNumberInputList = panelExcursions.querySelectorAll(
    'input[type = "number"]'
  );

  ticketNumberInputList.forEach((input) => {
    input.addEventListener("click", hideValidateSubmitTickets);
  });

  const adultNumber = evt.target.querySelector(`input[name = "adults"]`).value;
  const childNumber = evt.target.querySelector(
    `input[name = "children"]`
  ).value;

  const areSumbitTicketsValid = validateSubmitTickets(
    evt,
    adultNumber,
    childNumber
  );
  if (!areSumbitTicketsValid) {
    return;
  }

  const isBasketFull = validateBasketSize(evt, adultNumber, childNumber);
  if (isBasketFull) {
    alert(`You can't order more than 100 tickets in total.`);
    return;
  }

  const fileData = arrangedFileData[evt.target.parentElement.id - 1];

  const isTripInBasket = basket.some((item) => {
    return item.title === fileData[1];
  });

  if (isTripInBasket) {
    basket.forEach((item) => {
      if (item.title === fileData[1]) {
        if (item.adultNumber && adultNumber) {
          item.adultNumber = (
            parseInt(item.adultNumber) + parseInt(adultNumber)
          ).toString();
        } else if (adultNumber) {
          item.adultNumber = adultNumber;
        }

        if (item.childNumber && childNumber) {
          item.childNumber = (
            parseInt(item.childNumber) + parseInt(childNumber)
          ).toString();
        } else if (childNumber) {
          item.childNumber = childNumber;
        }
      }
    });
  } else {
    const summaryItemObj = {
      id: fileData[0],
      title: fileData[1],
      adultPrice: fileData[3],
      adultNumber: adultNumber,
      childPrice: fileData[4],
      childNumber: childNumber,
    };
    basket.push(summaryItemObj);
  }
  toBasketFinish();
}

function validateSubmitTickets(evt, adultNumber, childNumber) {
  let isValid = true;
  const regexValidator = /^([1-9]|[1-9][0-9]|100)$/;
  const adultsInputError = evt.target.querySelector(`div[name = "adults"]`);
  const childrenInputError = evt.target.querySelector(`div[name = "children"]`);

  if (adultNumber === "" && childNumber === "") {
    adultsInputError.innerText = "Invalid data!";
    childrenInputError.innerText = "Invalid data!";
    isValid = false;
  }

  if (adultNumber && !regexValidator.test(adultNumber)) {
    adultsInputError.innerText = "Invalid data!";
    isValid = false;
  }

  if (childNumber && !regexValidator.test(childNumber)) {
    childrenInputError.innerText = "Invalid data!";
    isValid = false;
  }

  if (isValid) {
    return true;
  } else {
    return false;
  }
}

function validateBasketSize(evt, adultNumber, childNumber) {
  let isFull = false;
  const submitTripID = evt.target.parentElement.getAttribute("id");

  basket.forEach((item) => {
    if (item.id === submitTripID) {
      let sum = 0;
      const toSumList = [];

      if (item.adultNumber) {
        toSumList.push(parseInt(item.adultNumber));
      }
      if (item.childNumber) {
        toSumList.push(parseInt(item.childNumber));
      }
      if (adultNumber) {
        toSumList.push(parseInt(adultNumber));
      }
      if (childNumber) {
        toSumList.push(parseInt(childNumber));
      }

      for (let i = 0; i < toSumList.length; i++) {
        sum += toSumList[i];
      }

      if (sum > 100) {
        isFull = true;
      }
    }
  });

  return isFull;
}

function showBasket() {
  const panelSummary = document.querySelector(".panel__summary");

  clearShownItems(panelSummary);

  basket.forEach((item) => {
    const summaryItemTemplate = panelSummary
      .querySelector(".summary__item--prototype")
      .cloneNode(true);
    summaryItemTemplate.classList.remove("summary__item--prototype");
    const title = summaryItemTemplate.querySelector(".summary__name");
    const summaryPrices = summaryItemTemplate.querySelector(".summary__prices");
    const summaryTotalPrice = summaryItemTemplate.querySelector(
      ".summary__total-price"
    );

    title.innerText = item.title + ":";

    if (item.adultNumber && item.childNumber) {
      summaryPrices.innerText = `adults: ${item.adultNumber} x ${item.adultPrice}PLN, children: ${item.childNumber} x ${item.childPrice}PLN.`;

      summaryTotalPrice.innerText =
        (
          parseInt(item.adultNumber) * parseInt(item.adultPrice) +
          parseInt(item.childNumber) * parseInt(item.childPrice)
        ).toString() + " PLN";
    } else if (item.adultNumber) {
      summaryPrices.innerText = `adults: ${item.adultNumber} x ${item.adultPrice}PLN.`;

      summaryTotalPrice.innerText =
        (parseInt(item.adultNumber) * parseInt(item.adultPrice)).toString() +
        " PLN";
    } else if (item.childNumber) {
      summaryPrices.innerText = `children: ${item.childNumber} x ${item.childPrice}PLN.`;

      summaryTotalPrice.innerText =
        (parseInt(item.childNumber) * parseInt(item.childPrice)).toString() +
        " PLN";
    }

    panelSummary.appendChild(summaryItemTemplate);
  });

  const deleteBtn = panelSummary.querySelectorAll(".summary__btn-remove");
  deleteBtn.forEach((item) => {
    item.addEventListener("click", removeItem);
  });

  showTotalPrice();
}

function removeItem(evt) {
  evt.preventDefault();
  const itemToDelete = evt.target.parentElement.parentElement;

  const panelSummary = document.querySelector(".panel__summary");
  const summaryItemsList = panelSummary.querySelectorAll(".summary__item");

  for (let i = 0; i < summaryItemsList.length; i++) {
    if (summaryItemsList[i] === itemToDelete) {
      const index = i - 1;
      basket.splice(index, 1);
    }
  }
  showBasket();
}

function showTotalPrice() {
  totalPrice = 0;
  basket.forEach((item) => {
    if (item.adultNumber) {
      totalPrice += parseInt(item.adultNumber) * parseInt(item.adultPrice);
    }
    if (item.childNumber) {
      totalPrice += parseInt(item.childNumber) * parseInt(item.childPrice);
    }
  });
  totalPrice.toString();

  const totalPricePlace = panelForm.querySelector(".order__total-price-value");

  totalPricePlace.innerText = totalPrice + " PLN";
}

function clearShownItems(basketContainer) {
  while (basketContainer.children[1]) {
    basketContainer.removeChild(basketContainer.children[1]);
  }
}

function hideValidateSubmitTickets(evt) {
  const evtParent = evt.target.parentElement;
  const inputAlert = evtParent.querySelector(".excursions__field-error");
  inputAlert.innerText = "";
}

function toBasketFinish() {
  const newEvent = new CustomEvent('toBasketFinish', {
    bubbles: false
  });

  document.dispatchEvent(newEvent);
}