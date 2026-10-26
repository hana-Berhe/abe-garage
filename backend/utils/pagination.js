const PAGE_SIZE = 10;

// Lists take ?page=&search= and return 10 rows plus a total count.
function readPage(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const search = (query.search || "").trim();
  return { page, search, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };
}

function pageResult(rows, total, page) {
  return { rows, total, page, page_size: PAGE_SIZE, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

module.exports = { readPage, pageResult, PAGE_SIZE };
