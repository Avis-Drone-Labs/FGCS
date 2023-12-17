export default function LoraSection({ data }) {
  return (
    <div className="w-full mx-2 my-4 bg-falcongrey-80 rounded-lg p-4">
      {/* <h2 className="text-3xl text-center border-b mb-4 pb-2 font-bold">
        Telemetry
      </h2> */}
      <div className="flex flex-row flex-wrap">
        {Object.keys(data).map((name, i) => {
          let value = data[name]
          return (
            <div key={i} className="w-1/2">
              <span className="w-36 inline-block uppercase text-neutral-200">
                {name}
              </span>
              <span className="text-neutral-50">{value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
