import React from 'react'

const StatusSummary = ({ data }) => {
  return (
    <section className="status-card card">
      <div className="section-header">
        <h2>Parcels by Status</h2>
      </div>

      <div className="status-chart">
        <div className="donut-chart" aria-hidden="true">
          <span>{data?.totalParcels || 0}</span>
        </div>
        <div className="status-list">
          <div className="status-item">
            <span className="status-color received" />
            <div>
              <strong>Received</strong>
              <p>{data?.received || 0}</p>
            </div>
          </div>
          <div className="status-item">
            <span className="status-color pending" />
            <div>
              <strong>Pending</strong>
              <p>{data?.pending || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default StatusSummary
