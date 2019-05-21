import React from 'react';
import { CopyToClipboard } from "react-copy-to-clipboard";
import i18n from '../i18n';
import {
  Flex,
  Box,
  Input,
  QR as QRCode
} from 'rimble-ui'

export default class Receive extends React.Component {
  constructor(props) {
    super(props);
    let initialState = {
    }
  }

  render() {
    let {
      changeAlert,
      url
    } = this.props

    return (
      <div>
        <CopyToClipboard text={url} onCopy={() => {
          changeAlert({type: 'success', message: i18n.t('share.copied')})
        }}>
          <Box>
            <Flex flexDirection={'column'} alignItems={'center'} p={3} border={1} borderColor={'grey'} borderRadius={1}>
              <QRCode value={url} size={'100%'} renderAs={'svg'} />
            </Flex>
            <Box mt={3}>
              <Input type='url' readOnly value={url} width={1} />
            </Box>
          </Box>
        </CopyToClipboard>
      </div>
    )
  }
}
