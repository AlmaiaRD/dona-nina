export default function KpiCard({
  title,
  value,
  icon: Icon,
  color = "primary",
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color?: "primary" | "green" | "amber" | "rose";
}) {
  const colorMap = {
    primary: "bg-[#7C1D2E]/10 text-[#7C1D2E]",
    green: "bg-[#5B9E6B]/10 text-[#5B9E6B]",
    amber: "bg-[#D4A017]/10 text-[#D4A017]",
    rose: "bg-[#E07A3A]/10 text-[#E07A3A]",
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E0D8] hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#9C8A82]">{title}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-2xl font-bold text-[#3D2B1F]">{value}</p>
    </div>
  );
}
