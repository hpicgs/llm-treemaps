import Container from 'react-bootstrap/Container';
import { Gear } from 'react-bootstrap-icons';
import Navbar from 'react-bootstrap/Navbar'


export default function Header({ hideSettings }) {
  function onSettingsClick() {
    hideSettings(false);
  }

  return (
    <>
      <Navbar fixed="top" expand={false} className="bg-body-tertiary mb-3">
        <Container>
          <Navbar.Brand href="#">Project Delphi</Navbar.Brand>
          <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-false`} onClick={onSettingsClick}>
            <Gear />
          </Navbar.Toggle>
        </Container>
      </Navbar>
    </>
  );
}