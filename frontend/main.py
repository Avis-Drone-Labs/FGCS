import sys
import PyQt6 as qt
import PyQt6.QtWidgets as qtw

if __name__ == "__main__":
    app = qtw.QApplication([])

    window = qtw.QWidget()
    window.setWindowTitle("PyQt App")
    window.setGeometry(100, 100, 280, 80)
    helloMsg = qtw.QLabel("<h1>Hello, World!</h1>", parent=window)
    helloMsg.move(60, 15)
    window.show()
    
    sys.exit(app.exec())