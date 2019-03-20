/** Third Party **/
const Wyre = window.Wyre;

/** Constants **/
const DEVICE_TOKEN__KEY = 'WYRE__DEVICE_TOKEN';

class WyreWrapper {
    async configure() {
        let deviceToken = localStorage.getItem(DEVICE_TOKEN__KEY);
        if (!deviceToken) {
            let array = new Uint8Array(25);
            window.crypto.getRandomValues(array);
            deviceToken = Array.prototype.map.call(array, x => ('00' + x.toString(16)).slice(-2)).join('');
            localStorage.setItem(DEVICE_TOKEN__KEY, deviceToken);
        }
    }

    displayWidget(
        destinationAddress,
        destinationAmount,
        onClose = () => {},
        onComplete = () => {}
    ) {
        const deviceToken = localStorage.getItem(DEVICE_TOKEN__KEY);

        const widget = new Wyre.Widget({
            env: 'prod',
            accountId: 'AC-396YDETRHDJ',
            auth: {
                type: 'secretKey',
                secretKey: deviceToken
            },
            operation: {
                type: 'debitcard',
                destCurrency: 'eth',
                dest: `ethereum:${destinationAddress}`,
                sourceAmount: parseInt(destinationAmount, 10),
            }
        });

        widget.on('complete', onComplete);
        widget.on('close', onClose);
        widget.on('ready', () => {
            widget.open();
        })
    }
}

export default new WyreWrapper();
