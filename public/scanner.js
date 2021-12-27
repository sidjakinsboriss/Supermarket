//Scanner functionality

function docReady(fn) {
    // see if DOM is already available
    if (document.readyState === "complete"
        || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

docReady(function () {
    let resultContainer = document.getElementById('qr-reader-results');
    let lastResult, countResults = 0;
    function onScanSuccess(decodedText, decodedResult) {
        if (decodedText !== lastResult) {
            ++countResults;
            lastResult = decodedText;
            const url = '/shopper/cart';
            const info = {
                code: decodedText
            }
            axios.post('/shopper/cart', {
                text: decodedText,
                result: decodedResult
            })
                .then(function (response) {
                    window.location = "/shopper/cart"
                })
                .catch(function (error) {
                    console.log(error);
                });

            // Handle on success condition with the decoded message.
            console.log(`Scan result ${decodedText}`, decodedResult);
        }
    }

    let html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader", { fps: 10, qrbox: 250 });

    html5QrcodeScanner.render(onScanSuccess);
});