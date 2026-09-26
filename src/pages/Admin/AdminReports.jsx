import { useEffect, useState } from 'react'
import { Loader2, Flag, Check, X, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getAdminReports, resolveAdminReport } from '../../lib/api.js'
import Button from '../../components/Button/Button.jsx'
import Badge from '../../components/Badge/Badge.jsx'
import './AdminReports.css'

export default function AdminReports() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="page admin-reports">
        <div className="container">
          <p>Admin access required.</p>
        </div>
      </div>
    )
  }

  async function loadReports() {
    setLoading(true)
    try {
      const data = await getAdminReports()
      setReports(data.reports)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  async function handleResolve(reportId, action, postStatus) {
    try {
      await resolveAdminReport(reportId, { action, postStatus })
      setMessage(action === 'resolve' ? 'Report resolved.' : 'Report dismissed.')
      loadReports()
    } catch (error) {
      setMessage(error.message)
    }
  }

  function getTargetDescription(report) {
    if (report.post) {
      return `Post: "${report.post.title}" by ${report.post.author?.name || 'Unknown'}`
    }
    if (report.comment) {
      return `Comment on post ${report.comment.postId} by ${report.comment.author?.name || 'Unknown'}`
    }
    return 'Unknown target'
  }

  if (loading) {
    return (
      <div className="page admin-reports">
        <div className="container admin-reports__loading"><Loader2 size={24} className="spin" /> Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="page admin-reports">
      <div className="container">
        <div className="admin-reports__header">
          <div>
            <h1>Community Reports</h1>
            <p>Review and resolve community content reports.</p>
          </div>
        </div>

        {message && <div className="admin-reports__message" role="status">{message}</div>}

        {reports.length === 0 ? (
          <div className="admin-reports__empty">
            <Shield size={48} />
            <h3>No reports</h3>
            <p>All caught up! No community reports pending.</p>
          </div>
        ) : (
          <div className="admin-reports__list">
            {reports.map((report) => (
              <article key={report.id} className="admin-reports__card">
                <div className="admin-reports__card-header">
                  <div className="admin-reports__reporter">
                    <span className="admin-reports__reporter-name">{report.reporter.name}</span>
                    <Badge tone="neutral" className="admin-reports__reporter-role">{report.reporter.role}</Badge>
                  </div>
                  <span className="admin-reports__date mono">{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="admin-reports__target">
                  <Flag size={16} /> {getTargetDescription(report)}
                </div>

                <div className="admin-reports__reason">
                  <strong>Reason:</strong> {report.reason}
                </div>

                <div className="admin-reports__actions">
                  <Button
                    variant="primary"
                    icon={Check}
                    size="sm"
                    onClick={() => handleResolve(report.id, 'resolve', 'HIDDEN')}
                    disabled={report.post?.status === 'HIDDEN'}
                  >
                    Resolve (hide content)
                  </Button>
                  <Button variant="outline" icon={X} size="sm" onClick={() => handleResolve(report.id, 'dismiss')}>
                    Dismiss
                  </Button>
                </div>

                {report.post && (
                  <div className="admin-reports__preview">
                    <strong>Post preview:</strong>
                    <p>{report.post.title}</p>
                    <p className="admin-reports__preview-body">{report.post.body.slice(0, 200)}...</p>
                  </div>
                )}
                {report.comment && (
                  <div className="admin-reports__preview">
                    <strong>Comment preview:</strong>
                    <p className="admin-reports__preview-body">{report.comment.body.slice(0, 200)}...</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}