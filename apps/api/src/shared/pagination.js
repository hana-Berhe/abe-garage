const PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

// Lists take ?page=&search= and return 10 rows plus a total count.
// Pick lists (such as technicians to assign) may ask for up to 100 with ?page_size=.
function readPage(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const search = (query.search || "").trim();
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.page_size, 10) || PAGE_SIZE));
  return { page, search, limit, offset: (page - 1) * limit };
}

function pageResult(rows, total, page, limit = PAGE_SIZE) {
  return { rows, total, page, page_size: limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

// A search typed as "%" or "_" means those characters, not "anything" (LIKE wildcards are escaped).
const likePattern = (search) => `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

module.exports = { readPage, pageResult, likePattern, PAGE_SIZE };
