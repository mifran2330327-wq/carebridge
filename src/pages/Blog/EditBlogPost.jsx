import { useParams } from 'react-router-dom'
import CreateBlogPost from './CreateBlogPost.jsx'

export default function EditBlogPost() {
  const { id } = useParams()
  return <CreateBlogPost postId={id} />
}
