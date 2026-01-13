const EdgeLabel = ({ x, y, label }: { x: number; y: number; label: string }) => {
  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
        background: '#eee',
        padding: '2px 5px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 'bold',
      }}
    >
      {label}
    </div>
  );
};

export default EdgeLabel;
