import logging


logger = logging.getLogger('')

formatter = logging.Formatter('[%(asctime)s %(module)s %(funcName)s] %(levelname)s - %(message)s')
ch = logging.StreamHandler()
ch.setFormatter(formatter)

logger.setLevel(logging.DEBUG)
logger.addHandler(ch)
