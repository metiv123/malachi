export function csvResponse(res, filename, csv) {
  res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`
  });
  res.end('\ufeff' + csv);
}
