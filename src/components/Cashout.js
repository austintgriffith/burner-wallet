//@format
import React, { Component } from "react";
import { Box, Field, Input } from "rimble-ui";
import { PrimaryButton } from "./Buttons";
import { format } from "@tammo/react-iban";
import styled from "styled-components";
import { isValid } from "iban";

const P = styled.p`
  color: gray;
`;

class Cashout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      IBAN: "",
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
      }
    };
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
            valid: name !== ""
          }
        });
      } else if (input === "IBAN") {
        const IBAN = this.refs.IBAN.value;
        newFields = Object.assign(fields, {
          IBAN: { value: format(IBAN), valid: isValid(IBAN) }
        });
      } else if (input === "amount") {
        const amount = this.refs.amount.value;
        newFields = Object.assign(fields, {
          amount: { value: amount, valid: parseFloat(amount) >= 11 }
        });
      }
      this.setState(newFields);
      console.log(this.state.fields);
    };
  }

  render() {
    const { fields } = this.state;
    return (
      <div>
        <Box mb={4}>
          <P>
            Transfer ether directly to your bank account using Bity.com, the
            secure swiss crypto gateway.{" "}
            <a
              href="https://bity.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              For more information, visit bity.com by clicking here
            </a>
            .
          </P>
          <Field mb={3} label="Bank Account Owner">
            <Input
              width={1}
              type="text"
              ref="name"
              placeholder="e.g. Satoshi Nakamoto"
              onChange={this.validate.bind(this)("name")}
              borderColor={
                fields.name.valid === null || fields.name.valid ? "grey" : "red"
              }
            />
          </Field>
          <Field mb={3} label="IBAN">
            <Input
              width={1}
              type="text"
              placeholder="e.g. DE89 3704 0044 0532 0130 00"
              ref="IBAN"
              value={fields.IBAN.value}
              onChange={this.validate.bind(this)("IBAN")}
              borderColor={
                fields.IBAN.valid === null || fields.IBAN.valid ? "grey" : "red"
              }
            />
          </Field>
          <Field mb={3} label="Amount">
            <Input
              ref="amount"
              width={1}
              type="number"
              onChange={this.validate.bind(this)("amount")}
              borderColor={
                fields.amount.valid === null || fields.amount.valid
                  ? "grey"
                  : "red"
              }
              placeholder="$0.00"
            />
          </Field>
        </Box>
        <P>
          Currently supported countries: Austria, Belgium, Bulgaria, Croatia,
          Cyprus, Czech Republic, Denmark, Estonia, Finland, France, Germany,
          Greece, Hungary, Iceland, Ireland, Italy, Latvia, Liechtenstein,
          Lithuania, Luxembourg, Malta, Monaco, Netherlands, Norway, Poland,
          Portugal, Romania, San Marino, Spain, Slovakia, Slovenia, Sweden,
          Switzerland, UK and Northern Ireland.{" "}
          <a
            href="https://doc.bity.com/exchange/v2.html#place-an-order"
            target="_blank"
            rel="noopener noreferrer"
          >
            For more information, click here
          </a>
          .
        </P>
        <PrimaryButton
          size={"large"}
          width={1}
          disabled={
            !(fields.name.valid && fields.IBAN.valid && fields.amount.valid)
          }
        >
          Cash out!
        </PrimaryButton>
      </div>
    );
  }
}

export default Cashout;
