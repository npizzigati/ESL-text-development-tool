function insert(originalString, index, insertion) {
  return originalString.slice(0, index) + insertion + originalString.slice(index);
}

export { insert };
