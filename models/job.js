"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
  /** Create a job, update db, return new job data.
   *
   * data should be { id, title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   * */
  static async create({ id, title, salary, equity, company_handle }) {
    const result = await db.query(
      `INSERT INTO jobss
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, thtle, salary, equity, company_handle`,
      [
        id,
        title,
        salary,
        equity,
        company_handle,
      ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle
           FROM jobs
           ORDER BY title`);
    return companiesRes.rows;
  }

  /** Returns filtered search results if user choses to use filters **/
  static async searchByFilter(searchFilters = {}) {
    const query = `SELECT id,
                          title,
                          salary,
                          equity,
                          company_handle
                    FROM jobs`;
    let whereFilters = [];

    const { minSalary, hasEquity, title } = searchFilters;

    if (title !== undefined) {
      whereFilters.push(`name ILIKE = ${title}`)
    }
    if (minSalary !== undefined) {
      whereFilters.push(`salary >= ${minSalary}`)
    }
    if (hasEquity === true) {
      whereFilters.push(`equity > 0`)
    }
    if (whereFilters.length > 0) {
      query += " WHERE " + whereFilters.join(" AND ");
    }

    const companiesRes = await db.query(query);
    return companiesRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *   where comapny is [{ handle, name, description, numEmployees, logoUrl, jobs }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS comapnyHandle
           FROM jobs
           WHERE id = $1
           ORDER BY id`,
      [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${title}`);

    const companiesRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [job.companyHandle],
    );
    job.company = companiesRes.rows[0];

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async delete(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;