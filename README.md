<!-- prettier-ignore -->
# Start Mongodb in Docker

docker run --name mongo-replica -p 27017:27017 -d mongo:latest mongod --replSet rs0 --bind_ip_all
docker exec -it mongo-replica mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"

something something make an _actual_ readme

mention dynamic/customizable UI colours and how it's done (layout.tsx)

# responsive

GitHub
Lighthouse score of
Performance: 100
Accessibility: 95-100 (depending on colour palette chosen)
Best practices: 100
SEO: 100

todo: mention backend features lol (testing, eslint/pre-commit, )

##

##

##

docker build -t lawlzer-site .
docker run -p 3000:3000 --env-file .env lawlzer-site

or

docker compose up --build -d
