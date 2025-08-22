import logging

def setup_logging() -> logging.Logger:
    
    fgcs_logger = logging.getLogger("fgcs")
    
    fgcs_logger.addHandler(
        logging.handlers
    )