import React from 'react'

const RecentParcels = ({ parcels = [], onViewAll = () => {} }) => {
  return (
    <section className="recent-parcels card">
      <div className="section-header">
        <h2>Recent Parcels</h2>
        <button type="button" className="secondary-button" onClick={onViewAll}>View All</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SR No.</th>
              <th>Customer Name</th>
              <th>Product</th>
              <th>Party</th>
              <th>Status</th>
              <th>Updated By</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {parcels.map((parcel) => (
              <tr key={parcel.id}>
                <td>{parcel.id}</td>
                <td>{parcel.customerName}</td>
                <td>{parcel.product}</td>
                <td>{parcel.partyName}</td>
                <td>
                  <span className={`status-pill status-${parcel.status.toLowerCase()}`}>
                    {parcel.status}
                  </span>
                </td>
                <td>{parcel.updatedBy}</td>
                <td>{parcel.updatedAt || parcel.sentDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default RecentParcels
