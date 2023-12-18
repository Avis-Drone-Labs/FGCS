import Navbar from './navbar'

export default function Layout({ children, currentPage }) {
  return (
    <>
      <Navbar currentPage={currentPage} />
      {children}
    </>
  )
}
