import React from 'react'

const ReportsPage = ({ reportRows = [], searchQuery = '' }) => {
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filteredReportRows = reportRows.filter((row) => {
    if (!normalizedSearch) return true
    return [row.partyName, row.id, row.customerName, row.phone, row.product, row.sendDate, row.status].some((value) => String(value).toLowerCase().includes(normalizedSearch))
  })

  const handleDownload = () => {
    const headers = ['Party', 'S. No.', 'Customer Name', 'Number', 'Product', 'Send Date', 'Received Status']
    const rows = filteredReportRows.map((row) => [
      row.partyName,
      row.id,
      row.customerName,
      row.phone,
      row.product,
      row.sendDate,
      row.status
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'parcel-report.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <section className="parties-page">
      <div className="page-header">
        <div>
          <p className="overline">Reports</p>
          <h1>Parcel Reports</h1>
          <p className="page-subtitle">View parcel records and export them to CSV format.</p>
        </div>

        <button className="primary-button" onClick={handleDownload}>
          Download CSV
        </button>
      </div>

      <div className="card report-card">
        <div className="section-header">
          <div>
            <h2>Report Summary</h2>
            <p className="section-copy">Recent parcel entries for the selected parties.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Party</th>
                <th>S. No.</th>
                <th>Customer Name</th>
                <th>Number</th>
                <th>Product</th>
                <th>Send Date</th>
                <th>Received Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReportRows.length === 0 ? (
                <tr>
                  <td colSpan="7">No matching parcel records found</td>
                </tr>
              ) : (
                filteredReportRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.partyName}</td>
                    <td>{row.id}</td>
                    <td>{row.customerName}</td>
                    <td>{row.phone}</td>
                    <td>{row.product}</td>
                    <td>{row.sendDate}</td>
                    <td>{row.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default ReportsPage
