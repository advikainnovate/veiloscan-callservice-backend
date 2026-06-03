function generateUserId(lastId) {
    let nextNumber;

    if (!lastId) {
        nextNumber = BigInt('10000000000001');
    } else {
        const numericPart = lastId.slice(3);
        nextNumber = BigInt(numericPart) + 1n;
    }

    const paddedNumber = nextNumber.toString().padStart(14, '0');
    return `NXU${paddedNumber}`;
}

function genMsterId(slug, digit, lastId) {
    let nextNumber;
    const len = digit.length;
    const slugLen = slug.length;

    if (!lastId) {
        nextNumber = BigInt(digit);
    } else {
        const numericPart = lastId.slice(slugLen);
        nextNumber = BigInt(numericPart) + 1n;
    }

    const paddedNumber = nextNumber.toString().padStart(len, '0');
    return `${slug}${paddedNumber}`;
}

module.exports = { generateUserId, genMsterId };
