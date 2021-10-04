/** Don't fully understand function so not sure how to test it */
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {
  test("works for partial update", function () {
    const res = sqlForPartialUpdate({ key: 'value' }, { key1: 'key', key2: 'value' });
    expect(result).toEqual({ setCols: 'key', values: 'value' })
  })
})