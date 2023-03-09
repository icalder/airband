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

## Internal wiring
SpyServer receives FFT samples and IQ samples from the wire.
SpyServer sample store:
  private _samples = reactive({
    iq: new Uint8Array(),
    fft: new Uint8Array(),
  })
  get samples()