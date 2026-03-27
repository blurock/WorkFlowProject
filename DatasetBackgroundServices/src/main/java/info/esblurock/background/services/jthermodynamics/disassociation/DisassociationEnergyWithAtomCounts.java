package info.esblurock.background.services.jthermodynamics.disassociation;

import org.openscience.cdk.interfaces.IAtomContainer;

import thermo.data.structure.disassociation.DisassociationEnergy;
import thermo.data.structure.structure.AtomCounts;

public class DisassociationEnergyWithAtomCounts extends AtomCounts {
	private static final long serialVersionUID = 1L;

	DisassociationEnergy energy;

	public DisassociationEnergyWithAtomCounts(IAtomContainer substructure, String source, Double disassociationEnergy,
			Double errorInEnergy) {
		super(substructure);
		energy = new DisassociationEnergy(substructure, source, disassociationEnergy, errorInEnergy);
	}

	public DisassociationEnergy getDisassociationEnergy() {
		return energy;
	}

	public String toString() {
		StringBuilder build = new StringBuilder();
		build.append(super.toString());
		build.append("\n");
		build.append(energy.toString());
		return build.toString();
	}
}
