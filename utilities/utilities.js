exports.stringify = obj =>
    Object.keys(obj)
      .map(k => `${k}=${encodeURIComponent(obj[k])}`)
      .join("&");
  