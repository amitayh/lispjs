/**
 * Simple object copy
 */
function copy(obj) {
  var result = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

module.exports = {
  copy: copy
};
