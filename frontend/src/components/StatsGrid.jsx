import React from 'react'

const StatsGrid = ({ data }) => {
  const cards = [
    { title: 'Total Parcels', value: data?.totalParcels || 0, subtitle: 'All registered parcels', accent: 'blue' },
    { title: 'Pending', value: data?.pending || 0, subtitle: 'Need action', accent: 'orange' },
    { title: 'Received', value: data?.received || 0, subtitle: 'Delivered parcels', accent: 'green' },
    { title: 'Total Parties', value: data?.totalParties || 0, subtitle: 'Active partners', accent: 'purple' },
  ]

  return (
    <section className="stats-grid">
      {cards.map((card) => (
        <article key={card.title} className={`stat-card stat-${card.accent}`}>
          <div className="stat-header">
            <span>{card.title}</span>
          </div>
          <h2>{card.value}</h2>
          <p>{card.subtitle}</p>
        </article>
      ))}
    </section>
  )
}

export default StatsGrid
