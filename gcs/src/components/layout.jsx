import Navbar from './navbar'

export default function Layout({ children, currentPage }) {
  return (
    <div>
      <Navbar currentPage={currentPage} />
      {children}
    </div>
  )
}
