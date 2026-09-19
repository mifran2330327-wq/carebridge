import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import Button from '../../components/Button/Button.jsx'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="page not-found">
      <div className="not-found__icon">
        <Compass size={40} />
      </div>
      <h1>Page not found</h1>
      <p>The page you’re looking for doesn’t exist or may have moved.</p>
      <Link to="/">
        <Button variant="primary">Back to home</Button>
      </Link>
    </div>
  )
}
