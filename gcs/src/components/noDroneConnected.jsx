export default function NoDroneConnected({ message }) {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-red-400">
        {message || "Not connected to drone. Please connect."}
      </p>
    </div>
  );
}

