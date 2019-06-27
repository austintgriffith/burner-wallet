//@format
import React, { Component } from "react";
import i18n from "../i18n";
import { Box, Field, Input } from "rimble-ui";
import { PrimaryButton } from "./Buttons";
import { format } from "@tammo/react-iban";
import styled from "styled-components";
import { isValid } from "iban";
import { placeOrder, getOrder, getEstimate } from "../services/bity";
import { gasPrice } from "../services/core";

const P = styled.p`
  color: gray;
`;

const Error = styled.span`
  padding: 6px 0 0 0;
  color: red;
  font-size: 0.7em;
`;

// See: https://doc.bity.com/exchange/v2.html#place-an-order
const SUPPORTED_COUNTRIES = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IS",
  "IE",
  "IT",
  "LV",
  "LI",
  "LT",
  "LU",
  "MT",
  "MC",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SM",
  "ES",
  "SK",
  "SI",
  "SE",
  "CH",
  "GB"
];

let MIN_AMOUNT_DOLLARS = 15;

let prevFormattedIBAN;

class Bity extends Component {
  constructor(props) {
    super(props);

    const pk = localStorage.getItem("metaPrivateKey");
    let metaAccount;
    if (pk && pk !== "0") {
      metaAccount = props.mainnetweb3.eth.accounts.privateKeyToAccount(pk);
    }

    this.state = {
      fields: {
        name: {
          value: null,
          valid: null
        },
        IBAN: {
          value: null,
          valid: null
        },
        amount: {
          value: null,
          valid: null
        }
      },
      metaAccount
    };

    this.validate = this.validate.bind(this);
    this.formatIBAN = this.formatIBAN.bind(this);
    this.cashout = this.cashout.bind(this);
  }

  async componentDidMount() {
    this.refs.name.focus();
    await this.getMinAmount();
  }

  async getMinAmount() {
    const { ethPrice } = this.props;
    let estimate;
    try {
      estimate = await getEstimate("1");
    } catch (err) {
      // TODO: Propagate to user
      console.log(err);
    }

    MIN_AMOUNT_DOLLARS = Math.round(estimate.input.minimum_amount * ethPrice);
  }

  async cashout() {
    const { IBAN } = this.validate("IBAN")();
    const { metaAccount } = this.state;
    const { name, amount } = this.state.fields;
    const {
      address,
      ethPrice,
      mainnetweb3,
      web3,
      changeView,
      setReceipt
    } = this.props;
    if (IBAN.valid) {
      changeView("loader");

      let order;
      const amountInEth = (amount.value / ethPrice).toString();
      try {
        order = await placeOrder(
          name.value,
          IBAN.value.replace(/\s/g, ""),
          amountInEth,
          address
        );
      } catch (err) {
        // TODO: Propagate to user
        console.log(err);
        return;
      }

      const orderURI = order.headers.get("Location").split("/");
      const orderId = orderURI[orderURI.length - 1];
      const {
        payment_details: { crypto_address }
      } = await getOrder(orderId);

      let receipt;
      if (metaAccount) {
        let gwei;
        try {
          gwei = await gasPrice();
        } catch (err) {
          // TODO: Propagate to user
          console.log("Error getting gas price", err);
          return;
        }
        const tx = {
          from: address,
          value: mainnetweb3.utils.toWei(amountInEth, "ether"),
          gas: 240000,
          gasPrice: Math.round(gwei * 1000000000),
          to: crypto_address
        };

        const signed = await mainnetweb3.eth.accounts.signTransaction(
          tx,
          metaAccount.privateKey
        );

        try {
          receipt = await mainnetweb3.eth.sendSignedTransaction(
            signed.rawTransaction
          );
        } catch (err) {
          // TODO: Propagate to user
          console.log(err);
        }
      } else {
        receipt = await web3.eth.sendTransaction({
          from: address,
          to: crypto_address,
          value: mainnetweb3.utils.toWei(amountInEth, "ether")
        });
      }
      const receiptObj = {
        to: "bity.com",
        from: address,
        amount: amount.value,
        result: receipt,
        message: i18n.t("offramp.success")
      };
      setReceipt(receiptObj);
      changeView("receipt");
    }
  }

  customIsValid(IBAN) {
    // https://en.wikipedia.org/wiki/International_Bank_Account_Number#IBAN_formats_by_country
    const countryCode = IBAN.slice(0, 2);
    const supportedCountry = SUPPORTED_COUNTRIES.includes(countryCode);
    if (supportedCountry) {
      if (isValid(IBAN)) {
        return "valid";
      } else {
        return "invalid";
      }
    } else {
      return "country";
    }
  }

  setCaretPosition(ctrl, pos) {
    // Modern browsers
    if (ctrl.setSelectionRange) {
      ctrl.focus();
      ctrl.setSelectionRange(pos, pos);

      // IE8 and below
    } else if (ctrl.createTextRange) {
      var range = ctrl.createTextRange();
      range.collapse(true);
      range.moveEnd("character", pos);
      range.moveStart("character", pos);
      range.select();
    }
  }

  formatIBAN(e) {
    const cursorPosition = e.target.selectionStart;
    const { fields } = this.state;
    const IBAN = this.refs.IBAN.value;
    const formattedIBAN = format(IBAN);

    const newFields = Object.assign(fields, {
      IBAN: {
        value: formattedIBAN,
        valid: fields.IBAN.valid
      }
    });
    this.setState(newFields, () => {
      // All IBANs are grouped in digits and letters of four
      // e.g. AEkk bbbc cccc cccc cccc ccc
      // NOTE: The author isn't very proud of the solution below :D
      let adjustedPosition = cursorPosition;
      if (
        prevFormattedIBAN &&
        prevFormattedIBAN.length > formattedIBAN.length &&
        cursorPosition % 5 === 0 &&
        cursorPosition !== 0
      ) {
        adjustedPosition--;
      } else if (
        prevFormattedIBAN &&
        prevFormattedIBAN.length < formattedIBAN.length &&
        cursorPosition % 5 === 0 &&
        cursorPosition !== 0
      ) {
        adjustedPosition++;
      }
      this.setCaretPosition(this.refs.IBAN, adjustedPosition);
      prevFormattedIBAN = formattedIBAN;
    });
  }

  validate(input) {
    return () => {
      const { fields } = this.state;
      let newFields;
      if (input === "name") {
        const name = this.refs.name.value;
        newFields = Object.assign(fields, {
          name: {
            value: name,
            valid: name !== "",
            message: name === "" ? i18n.t("offramp.required") : null
          }
        });
      } else if (input === "IBAN") {
        const IBAN = this.refs.IBAN.value;
        const validReason = this.customIsValid(IBAN);
        let valid, message;

        if (validReason === "valid") {
          valid = true;
        } else if (validReason === "country") {
          valid = false;
          message = i18n.t("offramp.country_not_supported");
        } else {
          valid = false;
          message = i18n.t("offramp.iban_incorrect");
        }
        newFields = Object.assign(fields, {
          IBAN: {
            value: format(IBAN),
            valid,
            message
          }
        });
      } else if (input === "amount") {
        const amount = parseFloat(this.refs.amount.value);
        const { ethPrice, ethBalance } = this.props;
        const min = MIN_AMOUNT_DOLLARS;
        const max = parseFloat(ethPrice) * parseFloat(ethBalance);

        let valid, message;
        if (amount < min) {
          valid = false;
          message = `${i18n.t(
            "offramp.amount_too_small"
          )} $${MIN_AMOUNT_DOLLARS}.`;
        } else if (amount > max) {
          valid = false;
          message = i18n.t("offramp.amount_too_big");
        } else {
          valid = true;
        }

        newFields = Object.assign(fields, {
          amount: {
            value: amount,
            valid,
            message
          }
        });
      }
      this.setState(newFields);
      return newFields;
    };
  }

  render() {
    const { fields } = this.state;
    return (
      <div>
        <Box mb={4}>
          {/* TODO: How to put this into i18n without creating a mess?*/}
          <P>
            Transfer your ether directly to your bank account with{" "}
            <b>just one click</b> using bity.com, the secure swiss crypto
            gateway. No cumbersome "Know Your Customer" (KYC) is required. Just
            filling out the three fields below. For more information, visit
            bity.com by{" "}
            <a
              href="https://bity.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              clicking here
            </a>
            .
          </P>
          <Field mb={3} label={i18n.t("offramp.form.owner")}>
            <Input
              width={1}
              type="text"
              ref="name"
              placeholder="Satoshi Nakamoto"
              onChange={this.validate("name")}
              borderColor={
                fields.name.valid === null || fields.name.valid ? "grey" : "red"
              }
            />
            {fields.name.message ? <Error>{fields.name.message}</Error> : null}
          </Field>
          <Field mb={3} label="IBAN">
            <Input
              width={1}
              type="text"
              placeholder="DE89 3704 0044 0532 0130 00"
              ref="IBAN"
              value={fields.IBAN.value}
              onChange={this.formatIBAN}
              borderColor={
                fields.IBAN.valid === null || fields.IBAN.valid ? "grey" : "red"
              }
            />
            {fields.IBAN.message ? <Error>{fields.IBAN.message}</Error> : null}
          </Field>
          <Field mb={3} label={i18n.t("offramp.form.amount")}>
            <Input
              ref="amount"
              width={1}
              type="number"
              onChange={this.validate("amount")}
              borderColor={
                fields.amount.valid === null || fields.amount.valid
                  ? "grey"
                  : "red"
              }
              placeholder="$0.00"
            />
            {fields.amount.message ? (
              <Error>{fields.amount.message}</Error>
            ) : null}
          </Field>
        </Box>
        <PrimaryButton
          size={"large"}
          width={1}
          disabled={!(fields.name.valid && fields.amount.valid)}
          onClick={this.cashout}
        >
          {i18n.t("offramp.form.submit")}
        </PrimaryButton>
      </div>
    );
  }
}

export default Bity;
