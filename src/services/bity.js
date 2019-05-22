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
    return fetch('https://bity.com/api/v2/orders/phone', {
        method: 'POST',
        body: JSON.stringify()
    })
}