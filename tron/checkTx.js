
function estimateBandwidth(signedTxn)
{
    var DATA_HEX_PROTOBUF_EXTRA = 3;
    var MAX_RESULT_SIZE_IN_TX = 64;
    var A_SIGNATURE = 67;

    var len = signedTxn.raw_data_hex.length /2 + DATA_HEX_PROTOBUF_EXTRA + MAX_RESULT_SIZE_IN_TX  ;
    var signatureListSize = signedTxn.signature.length
    console.log(signatureListSize)
    for(let i=0;i<signatureListSize;i++)
    {
        len += A_SIGNATURE;
    }
    return len;
}


estimateBandwidth("ba1b6e7443d418aae8c3a4a86a537f577822eaf6c4c269fbe442794f4b445772");
