# Airband

## Run
```
npm run dev
```

## Deploy

```
podman machine start
podman build -t icalder/airband .
podman push icalder/airband
podman machine stop
kubectl -n airband rollout restart deploy/airband
```