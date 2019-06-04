export const authenticate = data => {
  return fetch("https://bity.com/api/v2/login/phone", {
    method: "POST",
    body: JSON.stringify({
      phone_number: data
    }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    }
  })
    .then(response => response.json())
    .then(response => response)
    .catch(error => error);
};

export const verifyNumber = data => {
  return fetch("https://bity.com/api/v2/login/phone", {
    method: "POST",
    body: JSON.stringify({
      phone_number: localStorage.getItem("phoneNumber"),
      tan: data.tan
    }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Phone-Token": data.token
    }
  })
    .then(response => response)
    .catch(error => error);
};

export const placeOrder = data => {
  return fetch("https://exchange.api.bity.com/v2/orders", {
    method: "POST",
    body: JSON.stringify({
      input: {
        amount: data.amountInEth,
        currency: "ETH",
        type: "crypto_address",
        crypto_address: data.address
      },
      output: {
        currency: "EUR",
        type: "bank_account",
        iban: data.bityAccountNumber,
        owner: {
          name: data.name
        }
      }
    }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    }
  })
    .then(response => response.json())
    .then(response => response)
    .catch(error => error);
};

export const calculateEstimate = data => {
  return fetch("https://exchange.api.bity.com/v2/orders/estimate", {
    method: "POST",
    body: JSON.stringify({
      input: {
        currency: "ETH",
        amount: data.amount.toFixed(4)
      },
      output: {
        currency: "EUR"
      }
    }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    }
  })
    .then(response => response.json())
    .then(response => response)
    .catch(error => error);
};
