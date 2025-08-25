FROM python:3.11-slim
WORKDIR /workspace/apps/api
COPY apps/api/requirements.txt /workspace/apps/api/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/api /workspace/apps/api
EXPOSE 8000
